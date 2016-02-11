import pandas as pd
import json
import sys
import numpy as np

def top_industry(val):
    #reduce number of industries by merging to base industry.
    #eg. Technology: Software -> Technology

    ind = val.split(':')[0]
    
    #need better way to treat mistyped and repeated industry names
    if ind == "Consulting Services":
        return "Consulting services"
    else:
        return ind

def clean_industry(val):
    #remove trailing whitespaces!

    ind = val.strip()
    
    #need better way to treat mistyped and repeated industry names
    if ind == "Consulting Services":
        return "Consulting services"
    else:
        return ind

class Excel:

    def __init__(self, excel, leave_type = "paid"):
        self.leave_type = leave_type
        self.df = self.clean_excel(excel)
        
    def clean_excel(self, excel):
        df = pd.read_excel(excel)
        df.columns = ['company','industry_sub','paid','unpaid']

        df.industry_sub.fillna('Unspecified', inplace=True)
        df.company.fillna('Unspecified', inplace=True)

        df['industry_sub'] = df['industry_sub'].map(lambda x: clean_industry(x))
        df['industry_top'] = df['industry_sub'].map(lambda x: top_industry(x))
        df['parent'] = 'industry'
        
        #only return non-null values for specified leave
        #this way I don't need to ensure non NaN values in convert_to_dict function
        if self.leave_type: 
            df = df[df[self.leave_type].notnull()].reset_index(drop=True)

        return df
    

    def convert_to_dict(self):

        df = self.df
        leave_type = self.leave_type

        dict_1 = {'key': 'All Industries',
         'median': df[leave_type].median(),
          'mean': df[leave_type].mean(),
         'values': None}

        dict_2 = []

        for top_industry in df.industry_top.unique().tolist():
                        
            df_subset_top = df[df['industry_top']==top_industry]

            d = {'key':'','median':'','mean': '', 'values': None}
            d['key'] = top_industry
            d['median'] = df_subset_top[leave_type].median()
            d['mean'] = df_subset_top[leave_type].mean()

            sub_industries = df_subset_top.industry_sub.unique()

            dict_3 = []

            for sub_industry in sub_industries:

                df_subset_sub = df[df['industry_sub']==sub_industry]
                companies = df_subset_sub.company.unique()

                dsub = {'key':'','median':'','mean': '', 'values':None}
                dsub['key'] = sub_industry
                dsub['median'] = df_subset_sub[leave_type].median()
                dsub['mean'] = df_subset_sub[leave_type].mean()

                dict_3.append(dsub)

                dict_4 = []

                for company in companies:

                    df_subset_co = df[df['company']==company]

                    dco = {'key':''}
                    dco['key'] = company
                    dco['median'] = df_subset_co[leave_type].median()
                    dco['mean'] = df_subset_co[leave_type].mean()

                    dict_4.append(dco)

                dsub['values'] = dict_4

            if len(sub_industries)==1 and sub_industries[0] == top_industry:
                d['values'] = dict_4 #set top industry to values of corresponding sub industries
            else:
                d['values'] = dict_3

            dict_2.append(d) #append each top industry

        dict_1['values'] = dict_2
        
        return dict_1

    def write_to_json(self):

        converted_dict = self.convert_to_dict()
        
        if self.leave_type == "paid":
            file_name = "ML_data_paid_median.json"
        elif self.leave_type == "unpaid":
            file_name = "ML_data_unpaid_median.json"
        else:
            file_name = "ML_data_median.json"
            
        with open(file_name, 'w') as json_file:
            json.dump(converted_dict, json_file, sort_keys = True, indent = 4, ensure_ascii=True)

        print("Finished writing to {0} file".format(file_name))

    
if __name__ == "__main__":

    try:
        excel = sys.argv[1]
    except:
        excel = "Maternity_Leave_DB_12.25.15.xls"
    
    try:
        leave_type = sys.argv[2]
    except:
        leave_type = None #default
    
    obj = Excel(excel=excel, leave_type=leave_type)

    obj.write_to_json()

    
        

